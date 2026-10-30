package dev.polyglot.spring4.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.polyglot.spring4.common.CurrentUser;

@RestController
@RequestMapping("/")
@Validated
public class AuthController {

    public record RegisterRequest(
            @NotBlank @Size(min = 1, max = 100) String name,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AuthPayload register(@Valid @RequestBody RegisterRequest body) {
        return auth.register(body.name(), body.email(), body.password());
    }

    @PostMapping("/auth/login")
    public AuthService.AuthPayload login(@Valid @RequestBody LoginRequest body) {
        return auth.login(body.email(), body.password());
    }

    @GetMapping("/auth/me")
    public UserView me(@CurrentUser UserRow user) {
        return UserView.of(user);
    }
}
