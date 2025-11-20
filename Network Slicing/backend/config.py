from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings


PROJECT_ROOT = Path(__file__).resolve().parent


class Settings(BaseSettings):
    onos_url: str = Field("http://localhost:8181")
    opendaylight_url: str = Field("http://localhost:8181")
    onap_url: str = Field("http://localhost:8000")
    controller_user: str = Field("onos", env="NMS_CONTROLLER_USER")
    controller_password: str = Field("rocks", env="NMS_CONTROLLER_PASSWORD")
    poll_interval_seconds: int = 10
    redis_url: str = Field("redis://localhost:6379/0")
    enable_simulator: bool = True

    class Config:
        env_prefix = "NMS_"
        env_file = PROJECT_ROOT / ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

