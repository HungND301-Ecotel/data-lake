package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.config.BusinessException;

import com.quangnt0000.be_modul.dto.User.ChangePasswordRequest;
import com.quangnt0000.be_modul.dto.User.UserLogin;
import com.quangnt0000.be_modul.dto.User.UserRequest;
import com.quangnt0000.be_modul.dto.User.UserResponse;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.service.Iam.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    public ResponseEntity<?> addUser(UserRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> BusinessException.notFound("Employee not found"));
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .employee(employee)
                .build();
        user = userRepository.save(user);
        return ResponseEntity.ok(user.getId());
    }

    public ResponseEntity<?> updateUser(UserRequest request) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        user.setUsername(request.getUsername());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        user = userRepository.save(user);
        return ResponseEntity.ok(user.getId());
    }

    /**
     * Endpoint đăng nhập cũ, nay uỷ quyền cho luồng M01 để có khoá tài khoản
     * sau nhiều lần sai, MFA, phiên bản token và ghi audit.
     *
     * <p>Phản hồi vẫn chứa {@code token}, {@code refreshToken} và {@code role}
     * như trước, kèm thêm các trường mới ({@code roles}, {@code permissions},
     * {@code orgCode}, {@code clearanceLevel}) mà client cũ có thể bỏ qua.
     */
    public ResponseEntity<?> login(UserLogin request) {
        return authService.login(request);
    }

    public ResponseEntity<?> getUserByEmployeeId(String employeeId) {
        User user = userRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
        return ResponseEntity.ok(userResponse);
    }

    public ResponseEntity<?> getMyAccount() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> changePassword(ChangePasswordRequest request) {
        // Lấy thông tin user hiện tại từ SecurityContext
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        // Kiểm tra mật khẩu cũ có đúng không
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mật khẩu cũ không đúng");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Đổi mật khẩu phải vô hiệu các phiên cũ, phòng trường hợp mật khẩu
        // trước đó đã bị lộ (mục 9.2 - least privilege và vòng đời tài khoản).
        user.setTokenVersion((user.getTokenVersion() == null ? 0 : user.getTokenVersion()) + 1);
        userRepository.save(user);

        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }
}
