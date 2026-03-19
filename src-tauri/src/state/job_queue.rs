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

    pub fn list(&self) -> Vec<JobItem> {
        self.jobs.read().clone()
    }

    pub fn count(&self) -> usize {
        self.jobs.read().len()
    }
}
