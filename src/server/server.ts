import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`ConstitutionGuard Proposer MIP-003 server listening on port ${PORT}`);
  console.log(`  GET  /availability   - Health check`);
  console.log(`  GET  /input_schema   - Input schema`);
  console.log(`  POST /start_job      - Start governance action preparation`);
  console.log(`  GET  /status/:job_id - Check job status`);
  console.log(`  POST /provide_input/:job_id - Provide additional input`);
});
