import { useVoicePacket } from '@/hooks/useVoicepacket'

export default async function setupVoicePacket () {
  let { initVoicepacket } = useVoicePacket()
  initVoicepacket()
}