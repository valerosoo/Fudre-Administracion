package fudre.app.dto;

import java.util.List;

public class RecommendationDto {
    private List<WineDto> paraVos;
    private List<WineDto> nuevasExperiencias;

    public List<WineDto> getParaVos() { return paraVos; }
    public void setParaVos(List<WineDto> paraVos) { this.paraVos = paraVos; }
    public List<WineDto> getNuevasExperiencias() { return nuevasExperiencias; }
    public void setNuevasExperiencias(List<WineDto> nuevasExperiencias) { this.nuevasExperiencias = nuevasExperiencias; }
}
