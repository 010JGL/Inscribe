import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  TransactionReceipt,
  Client
} from "@hashgraph/sdk";

export async function handleWordSubmit(
  word: string,
  topicId: TopicId | undefined,
  isPrivate: boolean,
  client: Client,
  setTopics: React.Dispatch<React.SetStateAction<any[]>>,
  setLastCreatedTopicId: React.Dispatch<React.SetStateAction<TopicId | null>>,
  setSubmitKey: React.Dispatch<React.SetStateAction<PrivateKey | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  if (!client) {
    setError("Hedera client is not initialized.");
    return;
  }

  try {
    console.log('Submitted word:', word);

    let currentTopicId: TopicId;
    let newSubmitKey: PrivateKey | null = null;

    if (!topicId) {
      // Create a new topic
      const topicCreateTx = new TopicCreateTransaction();

      if (isPrivate) {
        newSubmitKey = PrivateKey.generate();
        topicCreateTx.setSubmitKey(newSubmitKey.publicKey);
        console.log("Creating topic with submit key:", newSubmitKey.toString());
      }

      const topicCreateSubmit = await topicCreateTx.execute(client);
      const topicCreateReceipt: TransactionReceipt = await topicCreateSubmit.getReceipt(client);
      const newTopicId: TopicId | null = topicCreateReceipt.topicId;

      if (newTopicId === null) {
        throw new Error("Failed to create topic");
      }

      console.log("New topic created with ID:", newTopicId.toString());
      setLastCreatedTopicId(newTopicId); // Update last created topic ID
      setSubmitKey(newSubmitKey); // Save the submit key
      currentTopicId = newTopicId;
    } else {
      currentTopicId = topicId;
    }

    // Split message into chunks if necessary
    const splitMessage = (message: string, maxChunkSize: number) => {
      const chunks: string[] = [];
      for (let i = 0; i < message.length; i += maxChunkSize) {
        chunks.push(message.slice(i, i + maxChunkSize));
      }
      return chunks;
    };

    const chunks = splitMessage(word, 1000);

    // Submit each chunk to the topic
    for (const chunk of chunks) {
      let messageTx = new TopicMessageSubmitTransaction()
        .setTopicId(currentTopicId)
        .setMessage(chunk);

      if (isPrivate && newSubmitKey) {
        try {
          console.log("Freezing and signing message with submit key:", newSubmitKey.toString());
          messageTx = await messageTx.freezeWith(client);
          messageTx = await messageTx.sign(newSubmitKey);
          console.log("Message signed successfully.");
        } catch (signError) {
          console.error("Error signing message with submit key:", signError);
          setError("Failed to sign message. Please try again.");
          return;
        }
      }

      try {
        const messageSubmit = await messageTx.execute(client);
        const messageReceipt = await messageSubmit.getReceipt(client);

        if (messageReceipt.status.toString() === "INVALID_SIGNATURE") {
          console.error("Invalid signature for message submission.");
          console.log("Submit key used:", newSubmitKey?.toString());
          console.log("Message transaction details:", messageTx);
          setError("Failed to submit message due to invalid signature. Please check your submit key.");
          return;
        }

        console.log("Message submitted to topic:", messageReceipt.status.toString());
      } catch (txError) {
        console.error("Error submitting message to topic:", txError);
        setError("Failed to submit message. Please try again.");
      }
    }

    // Add new topic and message to the state
    setTopics(prevTopics => [
      ...prevTopics,
      {
        topicId: currentTopicId,
        message: word,
        isPrivate,
        submitKey: newSubmitKey ? newSubmitKey.toString() : undefined
      }
    ]);
  } catch (err) {
    console.error("Error handling word submission:", err);
    setError("Failed to handle word submission. Please try again.");
  }
}
