package com.sav.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private FrameLayout errorLayout;
    private TextView errorText;
    private final String TARGET_URL = "https://sav-lat.vercel.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Manejar Splash Screen (API nativa de Android 12+)
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        errorText = findViewById(R.id.errorText);

        setupWebView();
        loadUrl();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Comportamiento de contenedor: no abrir navegador externo
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                errorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError("Error al cargar la plataforma. Por favor, verifica tu conexión.");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Solo navegar internamente si es nuestro dominio
                if (url.contains("sav-lat.vercel.app") || url.contains("supabase.co") || url.contains("onrender.com")) {
                    return false; // Cargar en el WebView
                }
                return true; // Bloquear o abrir fuera (opcional, aquí bloqueamos para ser un contenedor puro)
            }
        });
    }

    private void loadUrl() {
        if (isNetworkAvailable()) {
            webView.loadUrl(TARGET_URL);
        } else {
            showError("No hay conexión a internet disponible.");
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
    }

    private void showError(String message) {
        webView.setVisibility(View.GONE);
        progressBar.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
        errorText.setText(message);
    }

    public void retryConnection(View view) {
        errorLayout.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        loadUrl();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
