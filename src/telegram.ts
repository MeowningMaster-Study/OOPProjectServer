const serverLink = "https://api.telegram.org/";
const botId = "2082920227:AAHoIh5h5t0Mq10ZyUy5Ic9uAY5qKQLhNbM";
const chatIds = {
  andriiSemenystyi: "587954669",
};

const sendMessage = async (chatId: string, message: string) => {
  const url = new URL(serverLink + botId + "/sendMessage");
  url.searchParams.set("chat_id", chatId);
  url.searchParams.set("text", message);
  await fetch(url);
};

const sendMessages = async (message: string) => {
  const promises = new Array<Promise<void>>();
  Object.values(chatIds).forEach((chatId) =>
    promises.push(sendMessage(chatId, message))
  );
  await Promise.all(promises);
  console.log("Tg message:", message);
};

const telegram = {
  sendMessage,
  sendMessages,
};

export default telegram;
