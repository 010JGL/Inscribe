import {
  Client,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
  AccountId // Add this import
} from "@hashgraph/sdk";

export const initializeClient = (walletInterface: any) =>
  walletInterface
    ? Client.forNetwork(walletInterface.network).setOperator(
        walletInterface.accountId,
        walletInterface.privateKey
      )
    : Client.forTestnet().setOperator(
        AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID || ""),
        PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "")
      );

export const splitMessagesIntoChunks = (message: string, maxChunkSize: number = 100000) =>
  message.match(new RegExp(`.{1,${maxChunkSize}}`, 'g')) || [];

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const submitMessageToHedera = async (
  message: string,
  topicId: TopicId,
  client: Client,
  submitKey?: PrivateKey
) => {
  const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(message);
  if (submitKey) await tx.freezeWith(client).sign(submitKey);
  const txResponse = await tx.execute(client);
  console.log("Message submit receipt:", (await txResponse.getReceipt(client)).status.toString());
};

export const submitMessageWithRetries = async (
  message: string,
  topicId: TopicId,
  client: Client,
  submitKey?: PrivateKey,
  maxRetries: number = 10
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await submitMessageToHedera(message, topicId, client, submitKey);
      console.log("Message submitted successfully");
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes("429")) {
        console.warn("Rate limit hit, retrying...");
        await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
      } else {
        console.error("Unexpected error:", error);
        break;
      }
    }
  }
  console.error("Max attempts reached, failed to submit message");
};
