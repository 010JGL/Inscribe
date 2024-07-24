// topicUtils.ts
import { Client, PrivateKey, TopicCreateTransaction, TopicId } from "@hashgraph/sdk";

export const handleCreateTopic = async (
  client: Client | null,
  isPrivate: boolean,
  pdfText: string | null,
  setTopics: React.Dispatch<React.SetStateAction<{ topicId: TopicId; message: string; submitKey?: PrivateKey }[]>>,
  setLastCreatedTopicId: React.Dispatch<React.SetStateAction<TopicId | null>>,
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!client) {
    setError('Client is not initialized');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Initialize transaction
    let topicCreateTx = new TopicCreateTransaction();

    // Set submit key and admin key only if the topic is private
    let submitKey: PrivateKey | undefined;

    if (isPrivate) {
      submitKey = PrivateKey.generate();
      topicCreateTx = topicCreateTx.setSubmitKey(submitKey.publicKey);
      topicCreateTx = topicCreateTx.setAdminKey(submitKey);
      console.log("Generated submit key:", submitKey.toString());
    }

    // Execute the transaction
    const txResponse = await topicCreateTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId!;

    setLastCreatedTopicId(topicId);

    if (isPrivate && submitKey) {
      setSuccess(`Private topic created successfully. Submit Key: ${submitKey.toString()}`);
    } else {
      setSuccess('Topic created successfully');
    }

    // Add the topic to the list of topics
    setTopics(prev => [
      ...prev,
      { topicId, message: pdfText || '', submitKey }
    ]);
  } catch (error) {
    console.error('Error creating topic:', error);
    setError('Error creating topic');
  } finally {
    setLoading(false);
  }
};
