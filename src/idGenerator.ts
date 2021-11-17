const numbers = [...Array(10).keys()];
const alphabet = Array.from(Array(26))
    .map((_e, i) => i + 65)
    .map((x) => String.fromCharCode(x));
const charset = [...numbers, ...alphabet];
const length = 5;

const randomArrayItem = (arr: (string | number)[]) => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const generateId = () => {
    return Array(length)
        .map((_x) => randomArrayItem(charset))
        .join();
};

export default generateId;
