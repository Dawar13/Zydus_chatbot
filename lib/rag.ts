import knowledgeData from "@/data/vacuum-knowledge.json";

interface KnowledgeItem {
    issue: string;
    causes: string[];
    actions: string[];
}

interface VectorEntry {
    text: string;
    embedding: number[];
}

let vectorStore: VectorEntry[] = [];
let isInitialized = false;

// ── Simple embedding using term frequency (TF) vectors ──────────
// This is a lightweight, zero-dependency approach that works well
// for domain-specific keyword matching without needing a model download.

const vocabulary = new Map<string, number>();

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
}

function buildVocabulary(texts: string[]) {
    let idx = 0;
    for (const text of texts) {
        for (const token of tokenize(text)) {
            if (!vocabulary.has(token)) {
                vocabulary.set(token, idx++);
            }
        }
    }
}

function embed(text: string): number[] {
    const tokens = tokenize(text);
    const vector = new Array(vocabulary.size).fill(0);
    for (const token of tokens) {
        const idx = vocabulary.get(token);
        if (idx !== undefined) {
            vector[idx] += 1;
        }
    }
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
            vector[i] /= magnitude;
        }
    }
    return vector;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
    }
    return dot; // Vectors are already normalized, so dot product = cosine sim
}

// ── Initialize the vector store ────────────────────────────────

export function initializeRAG() {
    if (isInitialized) return;

    const knowledge = knowledgeData as KnowledgeItem[];

    // Build text chunks
    const chunks: string[] = knowledge.map(
        (item) =>
            `Issue: ${item.issue}\nCauses: ${item.causes.join(", ")}\nActions: ${item.actions.join(", ")}`
    );

    // Build vocabulary from all chunks
    buildVocabulary(chunks);

    // Embed and store
    vectorStore = chunks.map((text) => ({
        text,
        embedding: embed(text),
    }));

    isInitialized = true;
    console.log(`✓ RAG initialized with ${vectorStore.length} knowledge entries`);
}

// ── Retrieve top-K relevant chunks ─────────────────────────────

export function retrieve(query: string, topK = 2): string[] {
    if (!isInitialized) {
        initializeRAG();
    }

    const queryEmbedding = embed(query);

    const scored = vectorStore
        .map((entry) => ({
            text: entry.text,
            score: cosineSimilarity(queryEmbedding, entry.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    console.log(
        `RAG retrieved: ${scored.map((s) => `[${s.score.toFixed(3)}] ${s.text.slice(0, 50)}...`).join(" | ")}`
    );

    return scored.map((s) => s.text);
}
