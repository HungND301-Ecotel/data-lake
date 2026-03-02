package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.User.ChangePasswordRequest;
import com.quangnt0000.be_modul.dto.User.UserLogin;
import com.quangnt0000.be_modul.dto.User.UserRequest;
import com.quangnt0000.be_modul.service.DataLake.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody UserRequest request){
        return userService.addUser(request);
    }

    @PutMapping
    public ResponseEntity<?> updateUser(@RequestBody UserRequest request){
        return userService.updateUser(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLogin request){
        return userService.login(request);
    }

    @GetMapping("/employee/{employee-id}")
    public ResponseEntity<?> getUserByEmployeeId(@PathVariable ("employee-id") String employeeId){
        return userService.getUserByEmployeeId(employeeId);
    }

    @GetMapping("/my-account")
    public ResponseEntity<?> getMyAccount(){
        return userService.getMyAccount();
    }


    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request){
        return userService.changePassword(request);
    }


}
