type RouteAttrs = Record<string, string>;

class RoutePoint {
    performLookup: boolean;
    attrs: RouteAttrs;

    constructor() {
        this.performLookup = false;
        this.attrs = {};
    }
}

class RouteEdgeKey {
    src: string;
    dest: string;

    constructor(src: string, dest: string) {
        this.src = src;
        this.dest = dest;
    }

    toString(): string {
        // Unique string representation for use as a Map key
        return `${this.src}::${this.dest}`;
    }
}

class RouteEdgeValue {
    label: string[];
    attrs: RouteAttrs;

    constructor() {
        this.label = [];
        this.attrs = {};
    }
}

class RouteGraph {
    points: Map<string, RoutePoint>;
    edges: Map<string, RouteEdgeValue>;

    constructor() {
        this.points = new Map();
        this.edges = new Map();
    }

    private attrsToString(attrs: RouteAttrs): string {
        const keys = Object.keys(attrs);
        if (keys.length === 0) return '';
        const result = keys
            .map(k => `${this.escape(k)}="${this.escape(attrs[k])}"`)
            .join(',');
        return `[${result}]`;
    }

    private escape(s: string): string {
        // Use JSON.stringify for escaping, remove surrounding quotes
        return JSON.stringify(s).replace(/^"|"$/g, '');
    }

    addEdge(src: string, dest: string, label: string, attrs: RouteAttrs) {
        const edgeKey = new RouteEdgeKey(src, dest).toString();
        let edgeValue = this.edges.get(edgeKey);
        if (!edgeValue) {
            edgeValue = new RouteEdgeValue();
        }
        if (label.length > 0) {
            edgeValue.label.push(label);
        }
        for (const [k, v] of Object.entries(attrs)) {
            edgeValue.attrs[k] = v;
        }
        this.edges.set(edgeKey, edgeValue);
    }

    addPoint(name: string, performLookup: boolean, attrs: RouteAttrs) {
        let point = this.points.get(name);
        if (!point) {
            point = new RoutePoint();
        }
        point.performLookup = performLookup;
        for (const [k, v] of Object.entries(attrs)) {
            point.attrs[k] = v;
        }
        this.points.set(name, point);
    }

    getEdge(src: string, dest: string): RouteEdgeValue | undefined {
        const edgeKey = new RouteEdgeKey(src, dest).toString();
        return this.edges.get(edgeKey);
    }

    getPoint(name: string): RoutePoint | undefined {
        return this.points.get(name);
    }

    toGraphviz(): string {
        let result = '';

        for (const [name, value] of this.points.entries()) {
            let representation: string;
            if (value.performLookup) {
                representation = `AS${name}`;
            } else {
                representation = name;
            }
            const attrsCopy: RouteAttrs = { ...value.attrs, label: representation };
            result += `"${this.escape(name)}" ${this.attrsToString(attrsCopy)};\n`;
        }

        for (const [keyStr, value] of this.edges.entries()) {
            const [src, dest] = keyStr.split('::');
            const attrsCopy: RouteAttrs = { ...value.attrs };
            if (value.label.length > 0) {
                attrsCopy['label'] = value.label.join('\n');
            }
            result += `"${this.escape(src)}" -> "${this.escape(dest)}" ${this.attrsToString(attrsCopy)};\n`;
        }

        return `digraph {\n${result}}\n`;
    }
}

export {
    RoutePoint,
    RouteEdgeKey,
    RouteEdgeValue,
    RouteGraph
};

export type {
    RouteAttrs
};
