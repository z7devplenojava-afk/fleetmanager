package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailSendRequest {
    private String to;
    private String cc;
    private String bcc;
    private String subject;
    private String bodyHtml;
    private List<String> attachmentIds;
}
