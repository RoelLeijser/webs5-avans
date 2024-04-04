import { rabbit } from "./rabbitmq";
import { uploadScore } from "./schema";
import { mongoConnect } from "./mongooseconnect";
import { env } from "./env";

mongoConnect();

const calculateScore = (date: Date, score: number) => {
  const diff = date.getTime() - new Date().getTime();
  const timeScore = convertRange(diff, [0, 604800000], [0, 1]);
  return score + timeScore * 0.1;
};

function convertRange(value: number, r1: number[], r2: number[]) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

type ImaggaResponse = {
  result: {
    distance: number;
  };
};

async function getSimilarityScore(
  imageUrl1: string,
  imageUrl2: string
): Promise<ImaggaResponse> {
  const credentials = Buffer.from(
    `${env.IMAGGA_KEY}:${env.IMAGGA_SECRET}`
  ).toString("base64");
  const endpoint = `https://api.imagga.com/v2/images-similarity/categories/general_v3?image_url=${encodeURIComponent(imageUrl1)}&image2_url=${encodeURIComponent(imageUrl2)}`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch similarity score");
  }

  return (await response.json()) as ImaggaResponse;
}
const scoreCreatedPub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "target-events", type: "topic" }],
});

const reactionCreatedSub = rabbit.createConsumer(
  {
    queue: "targetReaction.created",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target-events", type: "topic" }],
    queueBindings: [
      { exchange: "target-events", routingKey: "targetReaction.created" },
    ],
  },
  async (msg) => {
    const { target, targetReaction } = msg.body;

    const simScore = await getSimilarityScore(
      target.imageUrl,
      targetReaction.imageUrl
    );
    const score = calculateScore(
      new Date(targetReaction.createdAt),
      simScore.result.distance
    );

    await uploadScore(score, target.id, targetReaction.id);
    await scoreCreatedPub
      .send("targetReaction.scorecreated", {
        score,
        targetId: target.id,
        responseId: targetReaction.id,
      })
      .then(() => {
        console.log("Score published.");
      })
      .catch((err) => {
        console.log("Error publishing score:", err);
      });
  }
);

reactionCreatedSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

console.log("Score service running.");
