export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const numbers = [...Array(10).keys()].map((x) => x.toFixed());
const alphabet = Array.from(Array(26))
    .map((_e, i) => i + 65)
    .map((x) => String.fromCharCode(x));
const charset = [...numbers, ...alphabet].filter((x) => x != "0" && x != "O");
const length = 5;

const randomChar = () => {
    return charset[Math.floor(Math.random() * charset.length)];
};

export function newId() {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += randomChar();
    }
    return password;
}
