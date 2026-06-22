from pydantic import BaseModel


class RankingItem(BaseModel):
    position: int
    user_id: str
    username: str
    xp: int
    streak: int
    is_me: bool


class RankingResponse(BaseModel):
    ranking: list[RankingItem]
    my_xp: int
