import { rabbit } from "./rabbitmq";
import { uploadScore } from "./schema";
import { mongoConnect } from "./mongooseconnect";

mongoConnect();

const calculateScore = (date: Date, score: number) => {
  const diff = date.getTime() - new Date().getTime();
  const timeScore = convertRange(diff, [0, 604800000], [0, 1]);
  return score + timeScore * 0.1;
};

function convertRange(value: number, r1: number[], r2: number[]) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

async function getSimilarityScore(imageUrl1: string, imageUrl2: string) {
  const credentials = Buffer.from(
    `${process.env.IMAGGA_KEY}:${process.env.IMAGGA_SECRET}`
  ).toString("base64");
  const endpoint = `https://api.imagga.com/v2/images-similarity/categories/general_v3?image_url=${encodeURIComponent(imageUrl1)}&image2_url=${encodeURIComponent(imageUrl2)}`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })
    .then(async (res) => {
      return await res.json();
    })
    .catch((error) => {
      console.error("Error fetching similarity score:", error);
    });
  return response;
}

const scoreCreatedPub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "target-events", type: "topic" }],
});

const reactionCreatedSub = rabbit.createConsumer(
  {
    queue: "target.reactioncreated",
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
    exchanges: [{ exchange: "target-events", type: "topic" }],
    queueBindings: [
      { exchange: "target-events", routingKey: "target.reactioncreated" },
    ],
  },
  async (msg) => {
    const simScore: any = await getSimilarityScore(
      msg.body.target.imageUrl,
      msg.body.targetReaction.imageUrl
    );
    const score = calculateScore(
      new Date(msg.body.targetReaction.createdAt),
      simScore.result.distance
    );
    console.log(simScore);
    await uploadScore(score, msg.body.target.id, msg.body.targetReaction.id);
    await scoreCreatedPub.send("target.scorecreated", {
      score,
      targetId: msg.body.target.id,
      responseId: msg.body.targetReaction.id,
    });
  }
);

reactionCreatedSub.on("error", (err) => {
  console.log("consumer error (user-events)", err);
});

const testpub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "target-events", type: "topic" }],
});

console.log("Score service running.");

//get similarity score using 2 random real images
// const result = (async () => {
//   const result = await getSimilarityScore(
//     "https://static.wikia.nocookie.net/vsbattles/images/d/da/Kisspng-phil-the-minion-birthday-minions-despicable-me-cli-minion-5abb7634ceab95.0695696415222349328465.png/revision/latest/scale-to-width-down/240?cb=20180916000856",
//     "https://cdn11.bigcommerce.com/s-ydriczk/images/stencil/1500x1500/products/89800/96627/Otto-Minions-2-Official-Cardboard-Cutout-buy-now-at-starstills__59497.1659518609.jpg?c=2"
//   );
//   console.log(result);
// })();
