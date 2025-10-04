import uuid

url_namespace = uuid.NAMESPACE_URL


def create_uuid(id) -> str:
    card_uuid = uuid.uuid5(url_namespace, str(id))
    return f"http://localhost:8010/api/v1/card/{str(card_uuid)}"
