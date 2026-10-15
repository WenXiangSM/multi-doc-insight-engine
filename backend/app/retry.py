import time 

from google.genai import errors 


RETRY_WAIT_SECONDS = 10 


def with_retry(call): 
    try: 
        return call()
    
    except errors.APIError as exc: 
        if exc.code != 429: 
            raise 
        time.sleep(RETRY_WAIT_SECONDS)
        return call()