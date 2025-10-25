
import type { Metadata } from 'next';
import { FarQueueClientUI } from './components/FarQueueClientUI';

export const metadata: Metadata = {
  title: {
    default: 'FarQueue | Your Smart Farcaster Scheduler',
    template: '%s | FarQueue',
  },
  description: 'Schedule, optimize, and automate your Farcaster casts with on-chain accountability.',
};

export default function HomePage() {
  return <FarQueueClientUI />;
}