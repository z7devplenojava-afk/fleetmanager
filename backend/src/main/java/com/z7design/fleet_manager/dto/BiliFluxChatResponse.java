package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiliFluxChatResponse {

    private String reply;
    private String source;
    private boolean aiAvailable;

    public static BiliFluxChatResponse fallback(String reply) {
        return BiliFluxChatResponse.builder()
                .reply(reply)
                .source("fallback")
                .aiAvailable(false)
                .build();
    }

    public static BiliFluxChatResponse ai(String reply) {
        return BiliFluxChatResponse.builder()
                .reply(reply)
                .source("ai")
                .aiAvailable(true)
                .build();
    }
}
