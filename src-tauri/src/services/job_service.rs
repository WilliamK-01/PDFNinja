use crate::shared_types::JobItem;
use crate::state::job_queue::JobQueue;

pub struct JobService;

impl JobService {
    pub fn enqueue(queue: &JobQueue, mut job: JobItem) -> Result<JobItem, JobServiceError> {
        if job.id.trim().is_empty() {
            return Err(JobServiceError::Validation("job id is required".to_string()));
        }

        job.status = "queued".to_string();
        queue.enqueue(job.clone());
        Ok(job)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum JobServiceError {
    #[error("validation error: {0}")]
    Validation(String),
}
