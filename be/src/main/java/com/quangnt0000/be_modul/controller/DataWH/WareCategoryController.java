package com.quangnt0000.be_modul.controller.DataWH;


import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryRequest;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategorySearch;
import com.quangnt0000.be_modul.service.DataWH.WareCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wh-category")
@RequiredArgsConstructor
public class WareCategoryController {
    private final WareCategoryService wareCategoryService;

    @PostMapping
    public ResponseEntity<?> addCategory(@RequestBody WareCategoryRequest request) {
        return wareCategoryService.addCategory(request);
    }

    @DeleteMapping("/{category-id}")
    public ResponseEntity<?> deleteCategory(@PathVariable ("category-id") Integer categoryId) {
        return wareCategoryService.deleteCategory(categoryId);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllCategory() {
        return wareCategoryService.getAllCategory();
    }

    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute WareCategorySearch request) {
        return wareCategoryService.search(request);
    }
}
