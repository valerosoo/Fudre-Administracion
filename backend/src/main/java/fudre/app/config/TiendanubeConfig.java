package fudre.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class TiendanubeConfig {

    @Value("${tiendanube.store-id}")
    private String storeId;

    @Value("${tiendanube.access-token}")
    private String accessToken;

    @Bean
    public RestClient tiendanubeRestClient() {
        return RestClient.builder()
                .baseUrl("https://api.tiendanube.com/v1/" + storeId)
                .defaultHeader("Authentication", "bearer " + accessToken)
                .defaultHeader("User-Agent", "Fudre-Administracion (fran.e.negri@gmail.com)")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public String getStoreId() { return storeId; }
}
