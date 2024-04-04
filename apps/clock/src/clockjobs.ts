import { clockQueue } from "./bullsetup";

const addClock = async (targetId: string, date: Date) => {
  await clockQueue.add(
    { targetId },
    {
      delay: date.getTime() - Date.now(),
      attempts: 2,
      backoff: 2000,
      removeOnComplete: true,
    }
  );
};

const findByTargetId = async (targetId: string) => {
  const jobs = await clockQueue.getJobs(["waiting", "delayed", "active"]);
  const filteredjobs = jobs.filter((job) => job.data.targetId === targetId);
  return filteredjobs;
};

const updateClock = async (targetId: string, date: Date) => {
  const jobs = await findByTargetId(targetId);
  const job = jobs[0];
  if (await job?.isDelayed) {
    await clockQueue.removeJobs(job.id.toString());
    const options = {
      ...job.opts,
      delay: date.getTime() - Date.now(),
    };
    await clockQueue.add(job.data, options);
  }
};

const deleteClock = async (targetId: string) => {
  const jobs = await findByTargetId(targetId);
  jobs.forEach(async (job) => {
    await clockQueue.removeJobs(job.id.toString());
  });
};

export { addClock, findByTargetId, updateClock, deleteClock };
