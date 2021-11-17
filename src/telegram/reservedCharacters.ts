const reservedChars = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
];

const escapeReservedChars = (message: string) => {
    let result = "";
    for (const char of message) {
        if (reservedChars.includes(char)) {
            result += "\\";
        }
        result += char;
    }
    return result;
};

export default escapeReservedChars;
