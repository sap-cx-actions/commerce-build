import { Task } from '../../../src/models/build';

describe('Task', () => {
  it('should have a task property', () => {
    const task: Task = { task: 'build', name: 'Build Task', startTimestamp: new Date() };
    expect(task).toHaveProperty('task', 'build');
  });

  it('should have a name property', () => {
    const task: Task = { task: 'build', name: 'Build Task', startTimestamp: new Date() };
    expect(task).toHaveProperty('name', 'Build Task');
  });

  it('should have a startTimestamp property', () => {
    const startTimestamp = new Date();
    const task: Task = { task: 'build', name: 'Build Task', startTimestamp };
    expect(task).toHaveProperty('startTimestamp', startTimestamp);
  });
});