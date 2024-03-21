import { clockQueue } from "./bullsetup";

const addClock = async (target_id: string, date: Date) => {
  await clockQueue.add(
    { target_id },
    {
      delay: date.getTime() - Date.now(),
      attempts: 2,
      backoff: 2000,
      removeOnComplete: true,
    }
  );
};

const findByTargetId = async (target_id: string) => {
  const jobs = await clockQueue.getJobs(["waiting", "delayed", "active"]);
  const filteredjobs = jobs.filter((job) => job.data.target_id === target_id);
  return filteredjobs;
};

const updateClock = async (target_id: string, date: Date) => {
  const jobs = await findByTargetId(target_id);
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

const deleteClock = async (target_id: string) => {
  const jobs = await findByTargetId(target_id);
  jobs.forEach(async (job) => {
    await clockQueue.removeJobs(job.id.toString());
  });
};

export { addClock, findByTargetId, updateClock, deleteClock };
