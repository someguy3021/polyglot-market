package dev.polyglot.spring27.auth;

import javax.validation.Valid;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.polyglot.spring27.common.CurrentUser;

@RestController
@Validated
public class AuthController {

    public static class RegisterRequest {
        @NotBlank
        @Size(min = 1, max = 100)
        public String name;

        @NotBlank
        @Email
        @Size(max = 255)
        public String email;

        @NotBlank
        @Size(min = 8, max = 72)
        public String password;
    }

    public static class LoginRequest {
        @NotBlank
        @Email
        public String email;

        @NotBlank
        public String password;
    }

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AuthPayload register(@Valid @RequestBody RegisterRequest body) {
        return auth.register(body.name, body.email, body.password);
    }

    @PostMapping("/auth/login")
    public AuthService.AuthPayload login(@Valid @RequestBody LoginRequest body) {
        return auth.login(body.email, body.password);
    }

    @GetMapping("/auth/me")
    public UserView me(@CurrentUser UserRow user) {
        return UserView.of(user);
    }
}
