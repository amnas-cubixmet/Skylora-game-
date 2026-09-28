import type { Metadata } from 'next';
import { SoundMatchGame } from '../../components/sound-match/SoundMatchGame';
export const metadata: Metadata = { title: 'SKYLORA · Sound Match', description: 'Listen, match and learn in a calm sound garden. Six playful phonics adventures for young learners.' };
export default function SoundMatchPage() { return <SoundMatchGame/>; }
