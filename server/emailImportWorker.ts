import { runEmailImportForAllAgencies, testGmailConnection } from './emailLeadImportService';

const IMPORT_INTERVAL_MS = 30 * 60 * 1000;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function runImportCycle(): Promise<void> {
  if (isRunning) {
    console.log('[Email Import Worker] Previous import cycle still running, skipping...');
    return;
  }

  isRunning = true;
  try {
    await runEmailImportForAllAgencies();
  } catch (error) {
    console.error('[Email Import Worker] Error in import cycle:', error);
  } finally {
    isRunning = false;
  }
}

export function startEmailImportWorker(): void {
  console.log('[Email Import Worker] Starting email import worker...');
  console.log(`[Email Import Worker] Import interval: ${IMPORT_INTERVAL_MS / 1000} seconds`);
  
  testGmailConnection()
    .then(connected => {
      if (connected) {
        console.log('[Email Import Worker] Gmail connection verified');
      } else {
        console.log('[Email Import Worker] Gmail not connected - worker will check again on each cycle');
      }
    })
    .catch(err => {
      console.log('[Email Import Worker] Gmail connection check failed:', err.message);
    });

  setTimeout(() => {
    runImportCycle();
  }, 30000);

  intervalId = setInterval(() => {
    runImportCycle();
  }, IMPORT_INTERVAL_MS);
}

export function stopEmailImportWorker(): void {
  console.log('[Email Import Worker] Stopping email import worker...');
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function triggerManualImport(): Promise<void> {
  console.log('[Email Import Worker] Manual import triggered');
  return runImportCycle();
}

export function getWorkerStatus(): { isRunning: boolean; intervalMs: number } {
  return {
    isRunning,
    intervalMs: IMPORT_INTERVAL_MS,
  };
}
