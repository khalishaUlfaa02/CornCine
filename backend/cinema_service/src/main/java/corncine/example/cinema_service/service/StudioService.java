package corncine.example.cinema_service.service;

import java.util.List;
import corncine.example.cinema_service.payload.req.StudioReq;
import corncine.example.cinema_service.payload.res.StudioRes;

public interface StudioService {
    List<StudioRes> getStudiosByCinemaId(Integer cinemaId);
    StudioRes getStudioById(Integer studioId);
    void createStudio(StudioReq req);
    void updateStudio(Integer studioId, StudioReq req);
    void deleteStudio(Integer studioId);
}
