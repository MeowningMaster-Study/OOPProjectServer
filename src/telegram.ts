const chatIds = {
    meowningMaster: 587954669,
    dmiron: 530387974,
    theblacl1ght: 528003604,
};

const init = (token: string) => {
    const serverLink = "https://api.telegram.org/";

    const sendMessage = async (chatId: number, message: string) => {
        const url = new URL(serverLink + "bot" + token + "/sendMessage");
        url.searchParams.set("chat_id", chatId.toFixed());
        url.searchParams.set("text", message);
        await fetch(url);
    };

    const sendMessages = async (message: string) => {
        const promises = new Array<Promise<void>>();
        Object.values(chatIds).forEach((chatId) =>
            promises.push(sendMessage(chatId, message))
        );
        await Promise.all(promises);
        console.log(message);
    };

    const log = (message: string) => {
        console.log(message);
        sendMessages(message);
    };

    return log;
};

export default init;
