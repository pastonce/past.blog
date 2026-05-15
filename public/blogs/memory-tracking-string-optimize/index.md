## 跟踪内存的简单方法

为了优化程序的运行速度，首先重要的是跟踪内存的分配与释放，下面提供了一个简单的方法：

```c++
#include <iostream>
#include <memory>

void* operator new(size_t size) {
    std::cout << "Allocating " << size << " bytes\n";
    return malloc(size);
}
void operator delete(void* memory, size_t size) {
    std::cout << "Freeing " << size << " bytes\n";
    free(memory);
}
struct Object {
    int x, y, z;
};

int main() {
    std::string str = "Pastonce Pastonce Pastonce";
    {
        std::unique_ptr<Object> obj = std::make_unique<Object>();
    }
    // Allocating 27 bytes
    // Allocating 12 bytes
    // Freeing 12 bytes
}
```

* 使用**运算符重载机制**，在原`new`和`delete`方法的基础上添加输出信息或是记录调用次数等等（注意`delete`原本虽然不需要传入`size`参数，但依然可以通过重载获得该信息）
* 重载之后还可以通过在`new`和`delete`函数中**设置断点、追踪调用堆栈**来得知分配、释放内存的代码位置
* 还可以将上述逻辑包装如下：

```c++
struct AllocationMetrics {
    uint32_t TotalAllocated = 0;
    uint32_t TotalFreed = 0;
    uint32_t CurrentUsage() { return TotalAllocated - TotalFreed; }
};
static AllocationMetrics s_AllocationMetrics;
void* operator new(size_t size) {
    s_AllocationMetrics.TotalAllocated += size;
    return malloc(size);
}
void operator delete(void* memory, size_t size) {
    s_AllocationMetrics.TotalFreed += size;
    free(memory);
}
static void PrintMemoryUsage() {
    std::cout << "Memory Usage: " << s_AllocationMetrics.CurrentUsage() << " bytes\n";
}
```

* 这样就可以**随时随地使用`PrintMemoryUsage`函数**来跟踪内存使用情况了，结构体中也可以加入分配、释放内存次数等其他记录变量

## 如何让C++字符串更快

C++字符串之所以用起来很慢，是因为`string`的定义以及该库中的众多方法（如`substr`）都倾向于在堆上分配内存

### 反面示例与优化

```c++
#include <iostream>
#include <string>
#define STRING_VIEW 0

static uint32_t s_AllocCount = 0;
// 重载 new 操作符，添加记录内存分配次数的功能
void* operator new(size_t size) {
    s_AllocCount++;
    std::cout << "Allocating " << size << " bytes\n";
    return malloc(size);
}
#if STRING_VIEW == 0
void PrintString(const std::string& str) {
    std::cout << str << std::endl;
}
#else
void PrintString(std::string_view str) {
    std::cout << str << std::endl;
}
#endif

int main() {
#if STRING_VIEW == 0
    std::string words = "I am the shimmering light that flows from the eyes of the creator.";
    std::string firstSection = words.substr(0, 25);
    std::string lastSection = words.substr(26, 40);
#else
    const char* words = "I am the shimmering light that flows from the eyes of the creator.";
    std::string_view firstSection(words, 25);
    std::string_view lastSection(words + 26, 40);
#endif
    PrintString(firstSection);
    std::cout << s_AllocCount << " allocations" << std::endl;
    std::cin.get();
}
```

* `STRING_VIEW = 0`时，输出如下：
```c++
Allocating 67 bytes
Allocating 26 bytes
Allocating 41 bytes
I am the shimmering light
3 allocations
```

* 这表明定义`std::string`、两次使用`substr`方法均进行了内存分配

* `STRING_VIEW = 1`时，启用优化，主要包括**将静态字符串定义为`const char*`格式**而非构造`std::string`，使用**仅取指定字符串的视图**的类型`std::string_view`（指针+截取长度），输出如下：
```c++
I am the shimmering light
0 allocations
```

* 这表明已没有分配内存的操作，对字符串的使用将更加高效

### SSO技术

上述代码中，若`words`的内容较少，或`substr`方法截取的字符串较短，即使不做手动优化也会出现零分配的情况，这是因为现代编译器普遍采用了 **SSO（Small String Optimization，小字符串优化）技术**。

* 当字符串长度$\le$ SSO 容量阈值（通常 15 ~ 22 字节）时，将会直接存储在`std::string`对象**内部的缓冲区**中（栈空间）
* 当字符串长度$\ge$ SSO 容量阈值时，将会在堆上动态分配内存存储数据（堆空间）
* 字符串修改时还可能触发**栈到堆的数据迁移**

### 注意事项

在使用字符串字面量（详见[[C++自学 10] | C++字符串](https://past-blog.vercel.app/blog/string-in-cplusplus)）进行函数调用时，即使通过常量引用的方式接收变量（如`PrintString(cont std::stirng& str)`）也可能**会引发内存分配**，系统会先构造一个`std::string`对象然后传递引用；而若**通过`PrintString(std::string_view str)`的方式**接收字符串字面量，则不会引发额外的内存分配。