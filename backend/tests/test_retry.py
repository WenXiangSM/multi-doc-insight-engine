import pytest 
from google.genai import errors 

from app import retry 


"""Tests for the rate-limit retry."""

import pytest
from google.genai import errors

from app import retry


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    """Skip the real 10-second wait so tests stay fast."""
    monkeypatch.setattr(retry.time, "sleep", lambda seconds: None)


def rate_limited():
    return errors.APIError(429, {"error": {"message": "Resource exhausted"}})


def test_returns_result_when_first_call_works():
    assert retry.with_retry(lambda: "ok") == "ok"


def test_retries_once_after_rate_limit():
    calls = []

    def flaky():
        calls.append(1)
        if len(calls) == 1:
            raise rate_limited()
        return "ok"

    assert retry.with_retry(flaky) == "ok"
    assert len(calls) == 2


def test_gives_up_after_second_rate_limit():
    def always_limited():
        raise rate_limited()

    with pytest.raises(errors.APIError):
        retry.with_retry(always_limited)


def test_other_errors_are_not_retried():
    calls = []

    def broken():
        calls.append(1)
        raise errors.APIError(400, {"error": {"message": "Bad request"}})

    with pytest.raises(errors.APIError):
        retry.with_retry(broken)
    assert len(calls) == 1