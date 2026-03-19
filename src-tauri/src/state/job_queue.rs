use parking_lot::RwLock;

use crate::shared_types::JobItem;

#[derive(Default)]
pub struct JobQueue {
    jobs: RwLock<Vec<JobItem>>,
}

impl JobQueue {
    pub fn enqueue(&self, job: JobItem) {
        self.jobs.write().push(job);
    }

    pub fn update(&self, job_id: &str, update: impl FnOnce(&mut JobItem)) {
        if let Some(job) = self.jobs.write().iter_mut().find(|job| job.id == job_id) {
            update(job);
        }
    }

    pub fn list(&self) -> Vec<JobItem> {
        self.jobs.read().clone()
    }

    pub fn count(&self) -> usize {
        self.jobs.read().len()
    }
}
