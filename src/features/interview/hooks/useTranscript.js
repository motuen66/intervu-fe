import { useDeepgramTranscript } from "./useDeepgramTranscript";
import { useSpeechmaticsTranscript } from "./useSpeechmaticsTranscript";

const TRANSCRIPT_PROVIDERS = {
    DEEPGRAM: "deepgram",
    SPEECHMATICS: "speechmatics",
};

/**
 * Factory hook to select the transcription provider based on an environment variable.
 */
export function useTranscript(options) {
    const provider = import.meta.env.VITE_TRANSCRIPT_PROVIDER || TRANSCRIPT_PROVIDERS.DEEPGRAM;

    if (provider === TRANSCRIPT_PROVIDERS.SPEECHMATICS) {
        return useSpeechmaticsTranscript(options);
    } else {
        return useDeepgramTranscript(options);
    }
}
