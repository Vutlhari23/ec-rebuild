"""
this module contains custom pydantic validators
"""

from pydantic import AfterValidator
from typing import Annotated
from pydantic.types import StringConstraints


def letters_only(value: str) -> str:
    """
    this function checks if a string is letters only
    receives a string value to check
    returns a string value checked
    """
    if not value.isalpha():
        raise ValueError(f"{value} must contain only letters")
    return value


"""
letters only type annotation
"""
LettersOnly = Annotated[
    str, AfterValidator(letters_only), StringConstraints(to_lower=True)
]
