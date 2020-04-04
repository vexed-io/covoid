let cache = {};

export const get = (key) => {
    return cache[key]
};

export const set = (key, value) => {
    cache[key] = value;
};

export const reset = () => {
    cache = {};
}