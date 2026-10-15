"""Retries a Gemini call once when the API reports a rate limit."""

import time 

from google.genai import errors 


# Pause before the second attempt, in seconds.
RETRY_WAIT_SECONDS = 10 


def with_retry(call): 
    """Run call(). On a 429 rate-limit error, wait and run it once more."""
    try: 
        return call()
    
    except errors.APIError as exc: 
        # Anything other than a rate limit is passed straight through.
        if exc.code != 429: 
            raise 
        time.sleep(RETRY_WAIT_SECONDS)
        return call()