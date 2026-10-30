package dev.polyglot.spring4.common;

import java.util.List;

/** Конверт списка контракта: { data, meta }. */
public record PageResponse<T>(List<T> data, PageMeta meta) {
}
