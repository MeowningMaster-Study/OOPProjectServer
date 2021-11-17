import { Bot } from "https://deno.land/x/telegram@v0.1.1/mod.ts";

const chatIds = {
    meowningMaster: 587954669,
    dmiron: 530387974,
    theblacl1ght: 528003604,
};

const init = (token: string) => {
    const bot = new Bot(token);

    const sendMessage = async (chatId: number, message: string) => {
        await bot.telegram.sendMessage({
            chat_id: chatId,
            parse_mode: "MarkdownV2",
            text: message,
        });
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

export const formatCode = (code: string | undefined) => {
    return `\`${code}\``;
};

export default init;
