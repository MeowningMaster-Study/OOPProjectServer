const numbers = [...Array(10).keys()].map((x) => x.toFixed());
const alphabet = Array.from(Array(26))
    .map((_e, i) => i + 65)
    .map((x) => String.fromCharCode(x));
const charset = [...numbers, ...alphabet];
const length = 5;

const randomChar = () => {
    return charset[Math.floor(Math.random() * charset.length)];
};

const generateId = () => {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += randomChar();
    }
    return password;
};

export default generateId;
