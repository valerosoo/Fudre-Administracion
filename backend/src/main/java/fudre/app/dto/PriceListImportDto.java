package fudre.app.dto;

import java.util.List;

public class PriceListImportDto {
    private DistributorDto distributor;
    private List<PriceListItemImportDto> items;

    public DistributorDto getDistributor() { return distributor; }
    public void setDistributor(DistributorDto distributor) { this.distributor = distributor; }
    public List<PriceListItemImportDto> getItems() { return items; }
    public void setItems(List<PriceListItemImportDto> items) { this.items = items; }
}
