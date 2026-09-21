#pragma once
#include <mutex>
#include "Superpowered.h"
inline void initializeSuperpowered(const char* license) {
    static std::once_flag once;
    std::call_once(once, [license] { Superpowered::Initialize(license); });
}
