package com.quangnt0000.be_modul.service;

import com.quangnt0000.be_modul.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DataService {
    private final JdbcTemplate jdbcTemplate;
    public List<Map<String, Object>> getReport(DataDTO request) {
        //SELECT
        StringBuilder sql = new StringBuilder("SELECT ");
        sql.append(createSelect(request));
        //FROM
        sql.append(createFrom(request));
        //WHERE
        sql.append(createFilter(request));
        //GROUP
//        sql.append(createGroupBy(request));
        //ORDER
        sql.append(createOrderBy(request));
        System.out.println(sql);

        return jdbcTemplate.queryForList(sql.toString());
    }

    public String queryJdbcSingleValue(String sqlSyntax) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sqlSyntax);

        // Không có kết quả
        if (rows.isEmpty()) return "";

        // Lấy row đầu tiên
        Map<String, Object> firstRow = rows.get(0);

        // Lấy value đầu tiên trong row
        Object value = firstRow.values().stream().findFirst().orElse("");

        // convert thành string
        return value != null ? value.toString() : "";
    }


    public String createSelect(DataDTO report) {
        StringBuilder fieldSql = new StringBuilder();
        for (FieldDTO field : report.getFields().stream()
                .filter(FieldDTO::isVisible)
                .toList()) {
            fieldSql.append(field.getFieldKey()).append(" AS \"").append(field.getAlias()).append("\", ");
        }
        fieldSql.delete(fieldSql.length()-2, fieldSql.length());
        return fieldSql.toString();
    }

    public String createFrom(DataDTO report){
        StringBuilder fromSql = new StringBuilder();
        fromSql.append(" FROM ").append(report.getMainTable()).append(" ");
        for (SubDTO subTable : report.getSubs()){
            fromSql.append(subTable.getJoinType()).append(" ").append(subTable.getTableName()).append(" ON ").append(subTable.getJoinOn()).append(" ");
        }
        fromSql.delete(fromSql.length()-1, fromSql.length());
        return fromSql.toString();
    }

    private String createFilter(DataDTO report) {

        StringBuilder filterSql = new StringBuilder(" WHERE 1 = 1");
        for (FilterDTO filter : report.getFilters()){
            if(filter.getDefaultOperator() == null || filter.getDefaultOperator().equals("")) continue;
            String fieldKey = filter.getFieldKey();
            String operator = filter.getDefaultOperator();
            String rawValue = filter.getDefaultValue();
            String formattedValue = "";

            switch (filter.getValueType().toUpperCase()) {
                case "LIST":
                    // Tách chuỗi "a,b,c" → ('a','b','c')
                    List<String> items = List.of(rawValue.split(","));
                    String joined = items.stream()
                            .map(String::trim)
                            .map(v -> "'" + v + "'")
                            .reduce((a, b) -> a + ", " + b)
                            .orElse("");
                    formattedValue = "(" + joined + ")";
                    break;

                case "NUMBER":
                    // Không cần nháy, đảm bảo là số hợp lệ
                    formattedValue = rawValue.trim();
                    break;

                case "DATE":
                    // Giả sử ngày dạng yyyy-MM-dd → chuyển thành 'yyyy-MM-dd'
                    formattedValue = "'" + rawValue.trim() + "'";
                    break;

                default:
                    // Mặc định là chuỗi
                    formattedValue = "'" + rawValue.trim() + "'";
                    break;
            }
            filterSql.append(" AND ").append(fieldKey)
                    .append(" ").append(operator)
                    .append(" ").append(formattedValue);
        }
        return filterSql.toString();
    }

    public String createOrderBy(DataDTO report){
        List<OrderDTO> orderByList = report.getOrders().stream()
                .filter(OrderDTO::isVisible)            // chỉ lấy visible = true
                .sorted(Comparator.comparingInt(OrderDTO::getIndex)) // sắp xếp theo index
                .toList();
        if (orderByList.isEmpty()) return "";
        StringBuilder orderSql = new StringBuilder(" ORDER BY ");
        for (OrderDTO orderBy : orderByList){
            orderSql.append(orderBy.getFieldKey()).append(" ").append(orderBy.getOrderType()).append(", ");
        }
        orderSql.delete(orderSql.length() - 2, orderSql.length());
        return orderSql.toString();
    }

//    public String createGroupBy(DataDTO report){
//        List<GroupDTO> groupByList = report.getGroups().stream()
//                .filter(GroupDTO::isVisible)            // chỉ lấy visible = true
//                .sorted(Comparator.comparingInt(GroupDTO::getIndex)) // sắp xếp theo index
//                .toList();
//        if (groupByList.isEmpty()) return "";
//        StringBuilder orderSql = new StringBuilder(" GROUP BY ");
//        for (GroupDTO groupBy : groupByList){
//            orderSql.append(groupBy.getFieldKey()).append(" ").append(groupBy.getOrderType());
//        }
//
//        return orderSql.toString();
//    }
}
