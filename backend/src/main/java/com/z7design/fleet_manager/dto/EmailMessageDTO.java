package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailMessageDTO {
    private UUID id;
    private UUID accountId;
    private UUID folderId;
    private Long uid;
    private String messageIdHeader;
    private String inReplyTo;
    private String subject;
    private List<EmailAddressDTO> from;
    private List<EmailAddressDTO> to;
    private List<EmailAddressDTO> cc;
    private LocalDateTime date;
    private String bodyText;
    private String bodyHtml;
    private Boolean read;
    private Boolean flagged;
    private Boolean answered;
    private Boolean hasAttachments;
    private Long sizeBytes;
    private List<EmailAttachmentDTO> attachments;
}
