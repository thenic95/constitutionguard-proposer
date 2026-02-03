import { JobStore } from '../../server/stores/job-store';

describe('JobStore', () => {
  let store: JobStore;

  beforeEach(() => {
    store = new JobStore();
  });

  afterEach(() => {
    store.destroy();
  });

  it('should create a job with queued status', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);

    expect(job.id).toBeDefined();
    expect(job.status).toBe('queued');
    expect(job.input).toHaveLength(1);
    expect(job.input[0].key).toBe('userInput');
  });

  it('should retrieve a job by id', () => {
    const created = store.create([{ key: 'userInput', value: 'test' }]);
    const retrieved = store.get(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(created.id);
  });

  it('should return undefined for unknown id', () => {
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('should update job status', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);
    store.updateStatus(job.id, 'running');

    expect(store.get(job.id)!.status).toBe('running');
  });

  it('should set job result and mark as completed', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);
    store.setResult(job.id, { success: true, data: { foo: 'bar' } });

    const updated = store.get(job.id)!;
    expect(updated.status).toBe('completed');
    expect(updated.result!.success).toBe(true);
    expect(updated.result!.data).toEqual({ foo: 'bar' });
  });

  it('should set job result and mark as failed on error', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);
    store.setResult(job.id, { success: false, error: 'Something went wrong' });

    const updated = store.get(job.id)!;
    expect(updated.status).toBe('failed');
    expect(updated.result!.error).toBe('Something went wrong');
  });

  it('should add additional input', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);
    store.addInput(job.id, [{ key: 'extra', value: 'more data' }]);

    expect(store.get(job.id)!.input).toHaveLength(2);
  });

  it('should track store size', () => {
    expect(store.size()).toBe(0);
    store.create([{ key: 'userInput', value: 'test1' }]);
    store.create([{ key: 'userInput', value: 'test2' }]);
    expect(store.size()).toBe(2);
  });

  it('should clean up old jobs', () => {
    const job = store.create([{ key: 'userInput', value: 'test' }]);
    // Manually set createdAt to 25 hours ago
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    store.get(job.id)!.createdAt = oldDate;

    const removed = store.cleanup();
    expect(removed).toBe(1);
    expect(store.size()).toBe(0);
  });

  it('should not clean up recent jobs', () => {
    store.create([{ key: 'userInput', value: 'test' }]);

    const removed = store.cleanup();
    expect(removed).toBe(0);
    expect(store.size()).toBe(1);
  });

  it('should clear all jobs on destroy', () => {
    store.create([{ key: 'userInput', value: 'test1' }]);
    store.create([{ key: 'userInput', value: 'test2' }]);
    store.destroy();

    expect(store.size()).toBe(0);
  });
});
